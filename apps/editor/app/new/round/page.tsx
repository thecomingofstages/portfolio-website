import { createRound } from "@/app/actions";
import { NewDocForm } from "@/components/DocEditor";
import { BackTitle, HeaderSlot } from "@/components/SaveGroup";

export default function NewRound() {
  return (
    <div className="flex flex-col gap-8">
      <HeaderSlot id="header-title">
        <BackTitle title="New round" />
      </HeaderSlot>
      <div className="flex flex-col gap-2">
        <h1>New round</h1>
        <p className="max-w-prose text-muted">
          ใส่ชื่อรอบและวันเปิดปิดรับสมัครก่อน ตำแหน่ง ไทม์ไลน์ และโปสเตอร์ไปใส่ต่อในหน้าของรอบ รอบใหม่จะถูกซ่อนไว้ก่อน
          เว็บจะยังไม่แสดงจนกว่าคุณจะพร้อม
        </p>
      </div>
      <NewDocForm
        form="new-round"
        initial={{ title: "", opens_at: "", closes_at: "", positions: [], is_shown: false }}
        create={createRound}
        label="Create round"
      />
    </div>
  );
}
