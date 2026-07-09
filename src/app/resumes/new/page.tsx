import { ResumeEditor } from "@/components/resumes/resume-editor";
import { getEmptySnapshot } from "@/lib/resume-data";

export default function NewResumePage() {
  return (
    <ResumeEditor
      mode="create"
      initialForm={{
        title: "",
        content: getEmptySnapshot(),
      }}
      initialHistory={[]}
    />
  );
}
