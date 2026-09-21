from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class PermissionResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    model_config = {"from_attributes": True}

class RoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: list[PermissionResponse] = []
    model_config = {"from_attributes": True}
    
    @classmethod
    def from_orm_role(cls, role):
        perms = [PermissionResponse.model_validate(rp.permission) for rp in role.role_permissions if rp.permission]
        return cls(id=role.id, name=role.name, description=role.description, is_system=role.is_system, permissions=perms)

class UserResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    is_active: bool
    is_verified: bool
    is_superadmin: bool
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    roles: list[RoleResponse] = []
    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department_id: Optional[uuid.UUID] = None

class InviteUserRequest(BaseModel):
    email: EmailStr
    role_id: uuid.UUID

class AssignRoleRequest(BaseModel):
    role_id: uuid.UUID

class CreateRoleRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    permission_ids: list[uuid.UUID] = []

class UpdateRoleRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
