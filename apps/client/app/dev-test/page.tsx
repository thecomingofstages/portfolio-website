import ProjectHeader from "@/components/ProjectHeader";

export default function DevTestPage() {
  const sampleProject = {
    name: "ทำนองของสายฝน : The Hidden Saloon The Musical",
    start_date: "2025-06-28T00:00:00.000Z",
    end_date: "2025-06-29T00:00:00.000Z",
    venue: "Lido Connect Hall 2",
    pics: [],
  };

  const sampleProject2 = {
    name: "TCOS 2",
    start_date: "2025-06-28T00:00:00.000Z",
    end_date: "2025-06-29T00:00:00.000Z",
    venue: "ชื่อสถานที่จัดงาน",
    pics: [],
  };

  return (
    <div className="flex flex-col gap-12 py-6">
      <ProjectHeader project={sampleProject} />
      <ProjectHeader project={sampleProject2} />
    </div>
  );
}
