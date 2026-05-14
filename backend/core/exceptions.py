from rest_framework.exceptions import APIException


class BadRequest(APIException):
    status_code = 400
    default_detail = "Bad request."
    default_code = "bad_request"


class PermissionDenied(APIException):
    status_code = 403
    default_detail = "You do not have permission to perform this action."
    default_code = "permission_denied"
