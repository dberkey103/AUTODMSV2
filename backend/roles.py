from enum import Enum

class Role(str, Enum):
    OWNER_ADMIN     = "owner_admin"
    MANAGER         = "manager"
    SALESPERSON     = "salesperson"
    SERVICE_ADVISOR = "service_advisor"
    TECHNICIAN      = "technician"
    DETAILER        = "detailer"
    ACCOUNTING      = "accounting"
    READ_ONLY       = "read_only"

VALID_ROLES = {r.value for r in Role}
