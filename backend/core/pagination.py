from rest_framework.pagination import LimitOffsetPagination


class StandardPagination(LimitOffsetPagination):
    """
    Global pagination: 20 items default, 100 max.
    """
    default_limit = 20
    max_limit = 100
