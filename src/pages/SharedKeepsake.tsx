import { useParams } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { useSharedKeepsake, type SharedKeepsakeState } from "@/hooks/useSharedKeepsake";

const Header = ({ state }: { state: SharedKeepsakeState }) => (
  <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
    <div className="flex items-center gap-2">
      <BrandLogo className="h-8 w-8" />
      <span className="text-[15px] font-semibold">Kidzopedia</span>
    </div>
    {state.kind === "ready" && (
      <Button asChild variant="outline" size="sm">
        <a href={state.url} download="keepsake.pdf">
          <Download className="h-4 w-4" /> Download
        </a>
      </Button>
    )}
  </header>
);

const Loading = () => (
  <div className="flex flex-1 items-center justify-center text-muted-foreground">
    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening the photo book…
  </div>
);

const Missing = () => (
  <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
    <h1 className="text-xl font-semibold">This link isn&apos;t available</h1>
    <p className="mt-2 text-[14px] text-muted-foreground">
      It may have been turned off or copied incorrectly. Ask the person who shared it to send a new one.
    </p>
  </div>
);

const Content = ({ state }: { state: SharedKeepsakeState }) => {
  if (state.kind === "loading") return <Loading />;
  if (state.kind === "missing") return <Missing />;
  return <iframe title="Shared photo book" src={state.url} className="w-full flex-1 border-0" />;
};

/**
 * Public page behind a shared keepsake link (/k/<token>). The token is looked up on the server and the PDF is
 * shown from a local blob, so neither the storage host nor the file path ever appears in the address bar.
 */
const SharedKeepsake = () => {
  const { token = "" } = useParams();
  const state = useSharedKeepsake(token);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header state={state} />
      <Content state={state} />
    </div>
  );
};

export default SharedKeepsake;
