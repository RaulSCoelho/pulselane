import { MembershipRole, OrganizationInvitation } from '@prisma/client';

type BuildInvitationEmailInput = {
  invitation: Pick<
    OrganizationInvitation,
    'email' | 'role' | 'expiresAt' | 'token'
  >;
  invitedByName: string;
  organizationName: string;
  acceptUrl: string;
};

type InvitationEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function formatRole(role: MembershipRole): string {
  const labels: Record<MembershipRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
  };

  return labels[role];
}

export function buildInvitationEmail(
  input: BuildInvitationEmailInput,
): InvitationEmailContent {
  const roleLabel = formatRole(input.invitation.role);
  const expirationDate = input.invitation.expiresAt.toISOString();

  const subject = `Invitation to join ${input.organizationName} on Pulselane`;

  const text = [
    `You have been invited to join ${input.organizationName} on Pulselane.`,
    '',
    `Invited by: ${input.invitedByName}`,
    `Role: ${roleLabel}`,
    `Accept invitation: ${input.acceptUrl}`,
    `Expires at: ${expirationDate}`,
  ].join('\n');

  const html = `
    <p>You have been invited to join <strong>${input.organizationName}</strong> on Pulselane.</p>
    <p><strong>Invited by:</strong> ${input.invitedByName}</p>
    <p><strong>Role:</strong> ${roleLabel}</p>
    <p><a href="${input.acceptUrl}">Accept invitation</a></p>
    <p><strong>Expires at:</strong> ${expirationDate}</p>
  `.trim();

  return {
    subject,
    text,
    html,
  };
}
