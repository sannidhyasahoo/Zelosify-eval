export default function CircleLoader({ classNameOne, classNameTwo }) {
  return (
    <div className={`${classNameOne || "h-[350px]"} flex-center w-full`}>
      <div
        className={`${
          classNameTwo || "h-10 w-10"
        } animate-spin rounded-full border-2 border-border/60 border-t-coral`}
      ></div>
    </div>
  );
}
