export default function BoxHeader() {
  return (
    <div className="flex flex-col justify-center items-center gap-2">
      <div>
        <img
          src={"/assets/logos/main-logo.png"}
          alt="Zelosify Logo"
          className="block"
          width={120}
          height={40}
        />
      </div>
      <h1 className="text-2xl font-bold text-white mb-1 text-center tracking-tight">
        Welcome Back
      </h1>
      <p className="text-[#9c9c9d] text-sm mb-4 text-center">
        Sign in to continue to your dashboard
      </p>
    </div>
  );
}
