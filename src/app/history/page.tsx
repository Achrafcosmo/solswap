import HistoryTable from "@/components/HistoryTable";

export default function HistoryPage() {
  return (
    <>
      <div className="bg-mesh" />
      <div className="relative z-10 min-h-[calc(100vh-72px)] px-4 py-12">
        <HistoryTable />
      </div>
    </>
  );
}
