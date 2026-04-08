import { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceLayout from "../components/WorkspaceLayout";
import { useCourse } from "../context/CourseContext";
import { useNotification } from "../context/NotificationContext";
import { normalizeCourses } from "../utils/workspaceData";
import { useLms } from "../context/LmsContext";

const navItems = [{ to: "/content-creator", label: "Dashboard", end: true }];

export default function ContentCreatorDashboard() {
  const { courses, refreshCourses } = useCourse();
  const { notify } = useNotification();
  const lms = useLms();
  const [materials, setMaterials] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const hasLoaded = useRef(false);
  const uploadInputRef = useRef(null);
  const editInputRef = useRef(null);
  const [targetCourseId, setTargetCourseId] = useState("");
  const [videoLink, setVideoLink] = useState("");

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const visibleCourses = useMemo(() => normalizeCourses(courses), [courses]);

  useEffect(() => {
    const all = (lms.courses || []).flatMap((c) => (c.materials || []).map((m) => ({ ...m, courseTitle: c.title })));
    setMaterials(all);
  }, [lms.courses]);

  const openUploadPicker = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const courseId = targetCourseId || (lms.courses || [])[0]?.id;
    if (!courseId) return;
    lms.addMaterial({
      courseId,
      type: "PDF",
      title: file.name.replace(/\.[^.]+$/, ""),
      fileName: file.name,
    });
    notify(`${file.name} added to materials.`, "success");
    event.target.value = "";
  };

  const openEditPrompt = (material) => {
    setEditingMaterial(material);
  };

  const keepCurrentFile = () => {
    if (editingMaterial) {
      notify(`${editingMaterial.title} kept as is.`, "info");
    }
    setEditingMaterial(null);
  };

  const changeMaterialFile = () => {
    editInputRef.current?.click();
  };

  const handleEditSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file || !editingMaterial) return;

    lms.updateMaterial({
      courseId: editingMaterial.courseId,
      materialId: editingMaterial.id,
      type: "PDF",
      title: file.name.replace(/\.[^.]+$/, ""),
      fileName: file.name,
      videoUrl: "",
    });
    notify(`${file.name} replaced the previous file.`, "success");
    setEditingMaterial(null);
    event.target.value = "";
  };

  const deleteMaterial = (id) => {
    const mat = materials.find((m) => m.id === id);
    if (!mat) return;
    lms.removeMaterial({ courseId: mat.courseId, materialId: id });
  };

  return (
    <WorkspaceLayout
      title="Content workspace"
      subtitle="Upload, attach, and manage course materials"
      workspaceLabel="Content Creator Workspace"
      portalLabel="Content Creator Portal"
      navItems={navItems}
      action={
        <button type="button" className="workspace-primary-button" onClick={openUploadPicker}>
          Upload material
        </button>
      }
    >
      <input
        ref={uploadInputRef}
        type="file"
        className="workspace-hidden-input"
        onChange={handleUploadSelected}
      />
      <input
        ref={editInputRef}
        type="file"
        className="workspace-hidden-input"
        onChange={handleEditSelected}
      />

      <section className="workspace-panel">
        <h4>All materials</h4>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <select value={targetCourseId} onChange={(e) => setTargetCourseId(e.target.value)}>
            <option value="">Select course</option>
            {(lms.courses || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <input
            placeholder="Video link (optional)"
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
          />
          <button
            type="button"
            className="workspace-small-button muted"
            onClick={() => {
              const courseId = targetCourseId || (lms.courses || [])[0]?.id;
              if (!courseId || !videoLink.trim()) return;
              lms.addMaterial({
                courseId,
                type: "VIDEO",
                title: "Video",
                fileName: "",
                videoUrl: videoLink.trim(),
              });
              setVideoLink("");
              notify("Video link attached.", "success");
            }}
          >
            Attach video
          </button>
        </div>
        <div className="workspace-material-list">
          {materials.map((material) => (
            <div key={material.id} className="workspace-material-row">
              <div className="workspace-material-icon" />
              <div>
                <strong>{material.title}</strong>
                <p>{material.courseTitle || material.courseId}</p>
              </div>
              <span className="workspace-badge neutral">{material.type}</span>
              <div className="workspace-inline-actions">
                <button
                  type="button"
                  className="workspace-link-button"
                  onClick={() => openEditPrompt(material)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="workspace-link-button"
                  onClick={() => {
                    if (material.type === "VIDEO" && material.videoUrl) {
                      window.open(material.videoUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="workspace-link-button danger"
                  onClick={() => deleteMaterial(material.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {editingMaterial ? (
        <section className="workspace-panel workspace-upload-panel">
          <div className="workspace-panel-head">
            <h4>Edit material</h4>
            <button
              type="button"
              className="workspace-link-button"
              onClick={() => setEditingMaterial(null)}
            >
              Close
            </button>
          </div>
          <div className="workspace-edit-box">
            <p>
              Current file: <strong>{editingMaterial.title}</strong>
            </p>
            {editingMaterial.versionHistory?.length ? (
              <div style={{ marginTop: 8 }}>
                <p style={{ marginBottom: 6 }}>Version history</p>
                <div className="workspace-list">
                  {editingMaterial.versionHistory.map((v, idx) => (
                    <div key={`${editingMaterial.id}-${idx}`} className="workspace-list-item">
                      <div>
                        <strong>{new Date(v.at).toLocaleString()}</strong>
                        <p>{v.type} {v.fileName || v.videoUrl || ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <p>Was this file OK?</p>
            <div className="workspace-inline-actions">
              <button type="button" className="workspace-small-button muted" onClick={keepCurrentFile}>
                Keep file
              </button>
              <button type="button" className="workspace-primary-button" onClick={changeMaterialFile}>
                Change file
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </WorkspaceLayout>
  );
}
