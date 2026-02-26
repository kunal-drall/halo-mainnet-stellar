const errorMessages: Record<string, string> = {
  AccessDenied:
    "Access denied. Please make sure your Google account is authorized, or try again.",
  Configuration:
    "There is a server configuration issue. Please contact support.",
  Verification: "The verification link has expired. Please sign in again.",
  Default: "An error occurred during sign in. Please try again.",
};

export function AuthError({ error }: { error: string }) {
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
      <p className="font-medium mb-1">Sign in failed</p>
      <p className="text-red-300/80">{message}</p>
    </div>
  );
}
