export default function ProfileImage({ className }) {
  return (
    <div className="relative">
      <img
        src={"/assets/images/blog01.png"}
        alt="Profile"
        className={`rounded-full bg-[#1b1c1e] border border-[#2f3031] ${className || ""}`}
      />
    </div>
  );
}
