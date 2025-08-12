import Image from "next/image";
import logo from "@/public/logos/gym-rat-transparent-logo.svg";
import { RegisterForm } from "@/components/register-form";
import { register } from "@/data-access/actions/auth";

export default function RegisterPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background-grey">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm action={register} />
          </div>
        </div>
      </div>
      <div className="relative hidden my-auto lg:block">
        <Image
          src={logo}
          alt="Login Background"
          className="object-cover w-auto bg-transparent md:pr-20 "
          priority
        />
      </div>
    </div>
  );
}
