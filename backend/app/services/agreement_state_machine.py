from app.models.agreement import AgreementStatus

class AgreementStateMachine:
    # Define valid transitions from a given state to a list of allowed next states
    TRANSITIONS = {
        AgreementStatus.DRAFT: [AgreementStatus.IN_REVIEW, AgreementStatus.TERMINATED],
        AgreementStatus.IN_REVIEW: [AgreementStatus.APPROVED, AgreementStatus.DRAFT, AgreementStatus.TERMINATED],
        AgreementStatus.APPROVED: [AgreementStatus.SIGNED, AgreementStatus.IN_REVIEW, AgreementStatus.TERMINATED],
        AgreementStatus.SIGNED: [AgreementStatus.ACTIVE, AgreementStatus.TERMINATED],
        AgreementStatus.ACTIVE: [AgreementStatus.EXPIRED, AgreementStatus.TERMINATED],
        AgreementStatus.EXPIRED: [],
        AgreementStatus.TERMINATED: [],
    }

    @classmethod
    def can_transition(cls, current_state: AgreementStatus, new_state: AgreementStatus) -> bool:
        if current_state == new_state:
            return True # self transition is allowed or ignored
        
        allowed_next_states = cls.TRANSITIONS.get(current_state, [])
        return new_state in allowed_next_states

    @classmethod
    def validate_transition(cls, current_state: AgreementStatus, new_state: AgreementStatus):
        if not cls.can_transition(current_state, new_state):
            raise ValueError(f"Invalid transition from {current_state.value} to {new_state.value}")
