import { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceLayout from "../components/WorkspaceLayout";
import { useCourse } from "../context/CourseContext";
import { useNotification } from "../context/NotificationContext";
import { buildContentMaterials, normalizeCourses } from "../utils/workspaceData";

const navItems = [{ to: "/content-creator", label: "Dashboard", end: true }];

export default function ContentCreatorDashboard() {
  const { courses, refreshCourses } = useCourse();
  const { notify } = useNotification();
  const [materials, setMaterials] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const hasLoaded = useRef(false);
  const uploadInputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const visibleCourses = useMemo(() => normalizeCourses(courses), [courses]);

  useEffect(() => {
    setMaterials(buildContentMaterials(visibleCourses));
  }, [visibleCourses]);

  const openUploadPicker = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMaterials((prev) => [
      {
        id: `material-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ""),
        course: visibleCourses[0]?.title || "Introduction to Machine Learning",
        type: file.name.split(".").pop()?.toUpperCase() || "FILE",
      },
      ...prev,
    ]);
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

    setMaterials((prev) =>
      prev.map((material) =>
        material.id === editingMaterial.id
          ? {
              ...material,
              title: file.name.replace(/\.[^.]+$/, ""),
              type: file.name.split(".").pop()?.toUpperCase() || "FILE",
            }
          : material
      )
    );
    notify(`${file.name} replaced the previous file.`, "success");
    setEditingMaterial(null);
    event.target.value = "";
  };

  const deleteMaterial = (id) => {
    setMaterials((prev) => prev.filter((material) => material.id !== id));
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
        <div className="workspace-material-list">
          {materials.map((material) => (
            <div key={material.id} className="workspace-material-row">
              <div className="workspace-material-icon" />
              <div>
                <strong>{material.title}</strong>
                <p>{material.course}</p>
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
