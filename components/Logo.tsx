import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center h-full">
      <Image
        src="/to be used inside.png"
        alt="ResourceMaster Logo"
        width={140}
        height={50}
        className="h-10 w-auto object-contain"
        priority
      />
    </div>
  );
}

