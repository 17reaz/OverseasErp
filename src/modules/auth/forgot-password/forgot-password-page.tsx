import { AuthLayout } from "../components/auth-layout";

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <section>
        <h1>Forgot Password</h1>

        <form>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </div>

          <button type="submit">Send Reset Link</button>
        </form>
      </section>
    </AuthLayout>
  );
}