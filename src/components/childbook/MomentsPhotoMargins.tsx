import firstPhoto from "@/assets/moment-1.jpg";
import secondPhoto from "@/assets/moment-2.jpg";
import thirdPhoto from "@/assets/moment-3.jpg";

const prints = [
  { photo: thirdPhoto, position: "left-[17%] top-[6%] -rotate-12" },
  { photo: secondPhoto, position: "left-[51%] top-[5%] rotate-[11deg] scale-90" },
  { photo: firstPhoto, position: "left-[31%] top-[41%] -rotate-[10deg]" },
  { photo: thirdPhoto, position: "left-[55%] top-[64%] rotate-[9deg]" },
  { photo: secondPhoto, position: "bottom-[3%] left-[16%] -rotate-[11deg]" },
  { photo: secondPhoto, position: "right-[50%] top-[7%] -rotate-[10deg] scale-90" },
  { photo: firstPhoto, position: "right-[17%] top-[4%] rotate-12" },
  { photo: thirdPhoto, position: "right-[31%] top-[42%] rotate-[10deg]" },
  { photo: secondPhoto, position: "right-[55%] top-[65%] -rotate-[9deg]" },
  { photo: firstPhoto, position: "bottom-[3%] right-[16%] rotate-[11deg]" },
];

export const MomentsPhotoMargins = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--topbar-h,72px)] -z-10 hidden min-[1440px]:block"
  >
    <div className="absolute inset-y-0 left-0 w-[calc((100%-72rem)/2)]">
      {prints.slice(0, 5).map((print) => <Polaroid key={print.position} {...print} />)}
    </div>
    <div className="absolute inset-y-0 right-0 w-[calc((100%-72rem)/2)]">
      {prints.slice(5).map((print) => <Polaroid key={print.position} {...print} />)}
    </div>
  </div>
);

function Polaroid({ photo, position }: (typeof prints)[number]) {
  return (
    <div className={`absolute w-14 rounded-[2px] border border-border bg-card p-1 pb-2.5 shadow-soft min-[1600px]:w-16 ${position}`}>
      <div className="relative aspect-square overflow-hidden rounded-[1px] bg-[hsl(var(--sec-2)/0.32)]">
        <img src={photo} alt="" className="h-full w-full scrapbook-margin-art object-cover opacity-60" />
      </div>
      <span className="absolute -top-1 left-1/4 h-2 w-1/2 -rotate-6 bg-[hsl(var(--sec-2)/0.65)]" />
    </div>
  );
}
