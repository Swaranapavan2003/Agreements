from typing import TypeVar, Generic
from pydantic import BaseModel

T = TypeVar("T")

def calc_pages(total: int, per_page: int) -> int:
    if per_page <= 0:
        return 0
    return max(1, (total + per_page - 1) // per_page)
