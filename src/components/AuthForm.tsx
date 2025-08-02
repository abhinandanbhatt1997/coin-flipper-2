// src/components/AuthForm.tsx
import { useNavigate } from "react-router-dom";
// ...
const AuthForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle(); // This triggers OAuth redirect
    if (error) {
      toast.error("Google Sign-in failed");
    } else {
      navigate("/user"); // ✅ Redirects to dashboard after login
    }
  };

  return (
    <Button onClick={handleGoogleSignIn}>
      Sign in with Google
    </Button>
  );
};
