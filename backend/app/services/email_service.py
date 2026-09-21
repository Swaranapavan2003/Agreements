import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from app.core.config import settings
import structlog

log = structlog.get_logger()

template_dir = Path(__file__).parent.parent / "templates" / "email"
env = Environment(loader=FileSystemLoader(str(template_dir)))

class EmailService:
    async def send_email(self, to_email: str, to_name: str, subject: str, html_body: str, text_body: str = None) -> bool:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.from_name} <{settings.from_email}>"
            msg["To"] = f"{to_name} <{to_email}>"
            
            if text_body:
                msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))
            
            await aiosmtplib.send(
                msg,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                start_tls=settings.smtp_tls,
                username=settings.smtp_username or None,
                password=settings.smtp_password or None,
            )
            return True
        except Exception as e:
            log.error("email_send_failed", error=str(e), to=to_email)
            return False
    
    def render_template(self, template_name: str, context: dict) -> tuple[str, str]:
        try:
            html_tmpl = env.get_template(f"{template_name}.html")
            html = html_tmpl.render(**context)
        except Exception:
            html = context.get("message", "")
        try:
            text_tmpl = env.get_template(f"{template_name}.txt")
            text = text_tmpl.render(**context)
        except Exception:
            text = None
        return html, text
    
    async def send_verification_email(self, to_email: str, to_name: str, token: str):
        verify_url = f"{settings.frontend_url}/verify-email?token={token}"
        html, text = self.render_template("verification", {
            "name": to_name, "verify_url": verify_url, "app_name": settings.app_name
        })
        await self.send_email(to_email, to_name, f"Verify your email - {settings.app_name}", html, text)
    
    async def send_reset_password_email(self, to_email: str, to_name: str, token: str):
        reset_url = f"{settings.frontend_url}/reset-password?token={token}"
        html, text = self.render_template("reset_password", {
            "name": to_name, "reset_url": reset_url, "app_name": settings.app_name
        })
        await self.send_email(to_email, to_name, f"Reset your password - {settings.app_name}", html, text)
    
    async def send_invitation_email(self, to_email: str, org_name: str, inviter_name: str, token: str):
        accept_url = f"{settings.frontend_url}/accept-invitation?token={token}"
        html, text = self.render_template("invitation", {
            "org_name": org_name, "inviter_name": inviter_name, "accept_url": accept_url, "app_name": settings.app_name
        })
        await self.send_email(to_email, to_email, f"You're invited to join {org_name} on {settings.app_name}", html, text)

email_service = EmailService()
