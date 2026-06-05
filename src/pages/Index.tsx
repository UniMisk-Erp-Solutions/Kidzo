import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { AgeHero } from "@/components/childbook/AgeHero";
import { QuickStats } from "@/components/childbook/QuickStats";
import { RecentTimeline } from "@/components/childbook/RecentTimeline";
import { UpcomingMilestones } from "@/components/childbook/UpcomingMilestones";
import { CreateMomentCTA } from "@/components/childbook/CreateMomentCTA";
import { ExportKeepsakeButton } from "@/components/childbook/ExportKeepsakeButton";
import { FeatureTour } from "@/components/childbook/FeatureTour";
import { Flashbacks } from "@/components/childbook/Flashbacks";
import { DashboardSkeleton } from "@/components/childbook/DashboardSkeleton";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useMemories } from "@/hooks/useMemories";
import { useAchievements } from "@/hooks/useAchievements";
import { useDocuments } from "@/hooks/useDocuments";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child, isLoading: childLoading } = useActiveChild();
  const { data: memories = [] } = useMemories(child?.id);
  const { data: achievements = [] } = useAchievements(child?.id);
  const { data: documents = [] } = useDocuments(child?.id);

  const isOwner = !!child && !!user && child.user_id === user.id;

  useEffect(() => {
    if (!childLoading && !child && user) navigate("/onboarding", { replace: true });
  }, [child, childLoading, navigate, user]);

  if (childLoading || !child) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child.name} />

      <main className="mx-auto max-w-2xl px-6 py-6 md:max-w-4xl md:py-10">
        <div className="space-y-6 md:space-y-8">
          <AgeHero
            childId={child.id}
            childName={child.name}
            dob={new Date(child.dob)}
            avatarUrl={child.avatar_url}
            canEdit={isOwner}
          />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/export")}>
              <BookOpen className="h-4 w-4" /> Export & share
            </Button>
            <ExportKeepsakeButton
              childName={child.name}
              childDob={new Date(child.dob)}
              memories={memories}
              achievements={achievements}
            />
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => navigate("/family")}>
                <Users className="h-4 w-4" /> Family sharing
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/books/new")}
            className="group flex w-full items-center gap-4 rounded-3xl border border-border bg-gradient-celebrate p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card/80 text-accent-foreground">
              <BookOpen className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-secondary-foreground">
                Turn memories into a printed book
              </div>
              <div className="text-[12px] text-secondary-foreground/80">
                50+ templates · printed and shipped to your door
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-secondary-foreground transition-transform group-hover:translate-x-0.5" />
          </button>

          <QuickStats
            memoriesCount={memories.length}
            achievementsCount={achievements.length}
            documentsCount={documents.length}
          />
          <CreateMomentCTA />
          <Flashbacks memories={memories} variant="card" />
          <RecentTimeline memories={memories} achievements={achievements} />
          <UpcomingMilestones dob={new Date(child.dob)} childName={child.name} />
        </div>
      </main>

      <BottomNav />
      <FeatureTour />
    </div>
  );
};

export default Index;
