import Image from "next/image";

export default function UniversityLogo() {
  return (
    <div className="flex justify-center items-center">
      <Image
        src="/university.png"
        alt="Ambo University Logo"
        width={100}
        height={40}
        className="h-8 w-auto object-contain opacity-80"
        priority
      />
    </div>
  );
}

