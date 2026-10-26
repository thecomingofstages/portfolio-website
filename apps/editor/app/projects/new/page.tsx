import ProjectForm from "@/components/ProjectForm";
import { BackTitle, HeaderSlot } from "@/components/SaveGroup";

export default function NewProject() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <HeaderSlot id="header-title">
          <BackTitle title="New project" />
        </HeaderSlot>
        <h1>New project</h1>
        <p className="max-w-prose text-muted">
          ใส่แค่ช่องที่จำเป็นสำหรับสร้างโปรเจกต์ รูป สถานที่ และบล็อกต่าง ๆ ไปใส่ต่อในหน้าของโปรเจกต์ โปรเจกต์ใหม่จะถูกซ่อนไว้ก่อน
          เว็บจะยังไม่แสดงจนกว่าคุณจะพร้อม
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
