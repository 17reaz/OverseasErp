import { AuthLayout } from "../components/auth-layout";

export function ResetPasswordPage() {
  return (
    <AuthLayout>
      <section>
        <h1>Reset Password</h1>

        <form>
          <div>
            <label htmlFor="password">New Password</label>
            <input id="password" type="password" />
          </div>

          <div>
            <label htmlFor="confirm-password">Confirm Password</label>
            <input id="confirm-password" type="password" />
          </div>

          <button type="submit">Update Password</button>
        </form>
      </section>
    </AuthLayout>
  );
}