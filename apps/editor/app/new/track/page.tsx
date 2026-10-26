import { createTrack } from "@/app/actions";
import { NewDocForm } from "@/components/DocEditor";
import { BackTitle, HeaderSlot } from "@/components/SaveGroup";

export default function NewTrack() {
  return (
    <div className="flex flex-col gap-8">
      <HeaderSlot id="header-title">
        <BackTitle title="New track" />
      </HeaderSlot>
      <div className="flex flex-col gap-2">
        <h1>New track</h1>
        <p className="max-w-prose text-muted">
          ใส่แค่ชื่อและ key ก่อน รายละเอียด รูป และผลงานไปใส่ต่อในหน้าของสายงาน สายงานใหม่จะถูกซ่อนไว้ก่อน
          เว็บจะยังไม่แสดงจนกว่าคุณจะพร้อม
        </p>
      </div>
      <NewDocForm form="new-track" initial={{ display_name: "", key: "", is_shown: false }} create={createTrack} label="Create track" />
    </div>
  );
}
