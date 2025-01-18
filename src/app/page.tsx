import {
  SignedIn,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Home() {
  return (
    <div>
      <SignOutButton>
        <SignUpButton>
          <button>Sign Up</button>
        </SignUpButton>
      </SignOutButton>

      <UserButton />

      <SignedIn>
        <SignOutButton>
          <button>Sign Out</button>
        </SignOutButton>
      </SignedIn>
    </div>
  );
}
