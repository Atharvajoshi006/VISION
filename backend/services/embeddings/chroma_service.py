"""
Vision AI — ChromaDB Vector Database Service
Handles ingestion, indexing, and semantic search of transcript embeddings.
"""
import logging
from typing import Optional

import chromadb
from django.conf import settings
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

_embedding_model = None  # Lazy-loaded singleton


def get_embedding_model() -> SentenceTransformer:
    """Lazy-load the embedding model once per worker process."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("SentenceTransformer model loaded.")
    return _embedding_model


class ChromaDBService:
    """
    Manages two ChromaDB collections:
    - vision_transcripts: chunked video transcript embeddings
    - vision_lessons: lesson-level embeddings for recommendation search

    Design decisions:
    - Uses HTTP client for ChromaDB (Docker-deployed as separate service)
    - Embeddings generated locally with sentence-transformers (free, fast)
    - Each chunk stored with metadata for filtering
    """

    def __init__(self):
        self.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
        )
        self.transcript_collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_TRANSCRIPTS,
            metadata={"hnsw:space": "cosine"},
        )
        self.lesson_collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_LESSONS,
            metadata={"hnsw:space": "cosine"},
        )
        self.model = get_embedding_model()

    def ingest_transcript_chunks(self, video_id: str, chunks: list[dict]) -> int:
        """
        Ingest transcript chunks into ChromaDB.
        Each chunk: {"chunk_index": int, "text": str}
        Returns number of chunks ingested.
        """
        if not chunks:
            return 0

        ids = [f"{video_id}_chunk_{c['chunk_index']}" for c in chunks]
        texts = [c["text"] for c in chunks]
        embeddings = self.model.encode(texts, show_progress_bar=False).tolist()
        metadatas = [
            {"video_id": video_id, "chunk_index": c["chunk_index"]}
            for c in chunks
        ]

        self.transcript_collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )
        logger.info("Ingested %d transcript chunks for video %s", len(chunks), video_id)
        return len(chunks)

    def ingest_lesson(self, lesson_id: str, title: str, topics: list,
                      difficulty: float, summary: str) -> None:
        """Index a lesson for recommendation search."""
        text = f"{title}. Topics: {', '.join(topics)}. {summary}"
        embedding = self.model.encode([text], show_progress_bar=False).tolist()
        self.lesson_collection.upsert(
            ids=[str(lesson_id)],
            embeddings=embedding,
            documents=[text],
            metadatas=[{
                "lesson_id": str(lesson_id),
                "title": title,
                "difficulty": difficulty,
                "topic": topics[0] if topics else "general",
            }],
        )

    def search_lessons(self, query: str, n_results: int = 10,
                       difficulty_filter: Optional[float] = None) -> list[dict]:
        """
        Semantic search for lessons matching a query.
        Optionally filter by difficulty (returns lessons at or below tolerance).
        """
        query_embedding = self.model.encode([query], show_progress_bar=False).tolist()

        where_filter = None
        if difficulty_filter is not None:
            # ChromaDB where filter for difficulty <= tolerance + 0.2 buffer
            where_filter = {"difficulty": {"$lte": difficulty_filter + 0.2}}

        kwargs = dict(
            query_embeddings=query_embedding,
            n_results=n_results,
            include=["metadatas", "distances"],
        )
        if where_filter:
            kwargs["where"] = where_filter

        results = self.lesson_collection.query(**kwargs)

        output = []
        for metadata, distance in zip(
            results.get("metadatas", [[]])[0],
            results.get("distances", [[]])[0],
        ):
            output.append({**metadata, "similarity": round(1 - distance, 4)})
        return output

    def search_transcript(self, video_id: str, query: str, n_results: int = 5) -> list[dict]:
        """Search within a specific video's transcript chunks."""
        query_embedding = self.model.encode([query], show_progress_bar=False).tolist()
        results = self.transcript_collection.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            where={"video_id": video_id},
            include=["documents", "metadatas", "distances"],
        )
        output = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            output.append({"text": doc, "chunk_index": meta["chunk_index"],
                           "similarity": round(1 - dist, 4)})
        return output

    def delete_video_chunks(self, video_id: str) -> None:
        """Remove all chunks for a video (e.g., on re-processing)."""
        self.transcript_collection.delete(where={"video_id": video_id})
