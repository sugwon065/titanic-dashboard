import AgeSurvivalRateChart from "./components/AgeSurvivalRateChart";
import ClassSurvivalBar from "./components/ClassSurvivalBar";
import TitleSurvivalChart from "./components/TitleSurvivalChart";
import EmbarkedPortMap from "./components/EmbarkedPortMap";
import ModelMetricsCards from "./components/ModelMetricsCards";
import ShapSummaryPlot from "./components/ShapSummaryPlot";
import IndividualPrediction from "./components/IndividualPrediction";
import GenderCharts from "./components/GenderCharts";
import KpiCards from "./components/KpiCards";
import SectionWrapper from "./components/SectionWrapper";

export default function App() {
  return (
    <div className="min-h-screen bg-[#041222] p-3">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2.5">
        {/* Header */}
        <header className="flex flex-col gap-3 rounded-lg border border-[#23303f] bg-[#142230] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-[15px] font-bold tracking-wide text-white">
            Titanic Survival Analysis Dashboard
          </h1>
          <div className="rounded border border-[#23303f] bg-[#0d1a28] px-3 py-1.5 text-[15px] font-extrabold tracking-wide text-[#15803d]">
            KGU Data Analysis Club D.N.A
          </div>
        </header>

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[3fr_3fr_4fr]">
          {/* Left column */}
          <div className="flex h-full min-h-0 flex-col gap-2.5">
            <KpiCards />
            <GenderCharts />
            <ClassSurvivalBar />
            <TitleSurvivalChart className="flex-1" />
          </div>

          {/* Center column */}
          <div className="flex h-full min-h-0 flex-col gap-2.5">
            <AgeSurvivalRateChart />
            <EmbarkedPortMap className="flex-1" />
          </div>

          {/* Right column — Model + SHAP */}
          <div className="flex flex-col gap-2.5">
            <SectionWrapper title="Survived predict model by CatBoost">
              <ModelMetricsCards />
            </SectionWrapper>

            {/* SHAP Model Explainer header intentionally removed per design request */}
            <section className="rounded-lg border border-[#23303f] bg-[#17212e] p-2.5">
              <div className="flex flex-col gap-2">
                <ShapSummaryPlot />
                <IndividualPrediction />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
