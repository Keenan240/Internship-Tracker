import Motivate from "@/components/Motivate";
import SignInButton from '@/components/SignInButton';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

type JobPosting = {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  deadline?: string;
  link?: string;
  user_id?: string;
};

const statusLabels = ["Saved", "Applied", "Rejected", "Interview", "Offer"];

export default function Home() {
  const session = useSession();
  const supabase = useSupabaseClient();

  const [expanded, setExpanded] = useState<string | null>("Saved");
  const [showModal, setShowModal] = useState(false);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [form, setForm] = useState({ title: "", company: "", location: "", link: "", deadline: "" });
  const [editTarget, setEditTarget] = useState<JobPosting | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!session) return;

      const { data, error } = await supabase
        .from('Applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading jobs:', error);
      } else {
        setPostings(data);
      }
    };

    fetchJobs();
  }, [session, supabase]);

  const resetForm = () => {
    setForm({ title: "", company: "", location: "", link: "", deadline: "" });
    setEditTarget(null);
    setShowModal(false);
  };

  const toggleExpand = (label: string) => {
    setExpanded(expanded === label ? null : label);
  };

  const handleAddJob = async () => {
    if (!form.title || !form.company || !form.location) {
      alert("All fields are required!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Applications")
        .insert([
          {
            title: form.title,
            company: form.company,
            location: form.location,
            status: "Saved",
            user_id: session?.user.id,
            deadline: form.deadline,
            link: form.link,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        alert(`Failed to add job: ${error.message}`);
        return;
      }

      if (data) {
        setPostings((prev) => [data, ...prev]);
        resetForm();
      }
    } catch (err) {
      console.error("Unexpected error in handleAddJob:", err);
      alert("Something went wrong while adding your job.");
    }
  };

  const handleUpdateJob = async () => {
    if (!form.title || !form.company || !form.location || !editTarget) {
      alert("All fields are required!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Applications")
        .update({
          title: form.title,
          company: form.company,
          location: form.location,
          status: editTarget.status,
          deadline: form.deadline,
          link: form.link,
        })
        .eq("id", editTarget.id)
        .select()
        .single();

      if (error) {
        console.error("Update failed:", error.message);
        alert("Failed to update job.");
        return;
      }

      if (data) {
        setPostings((prev) => prev.map((p) => (p.id === data.id ? data : p)));
        resetForm();
      }
    } catch (err) {
      console.error("Unexpected error in handleUpdateJob:", err);
      alert("Something went wrong while updating the job.");
    }
  };

  const handleDeleteJob = async () => {
    if (!editTarget) return;

    try {
      const { error } = await supabase
        .from("Applications")
        .delete()
        .eq("id", editTarget.id);

      if (error) {
        console.error("Delete failed:", error.message);
        alert("Failed to delete job.");
        return;
      }

      setPostings((prev) => prev.filter((p) => p.id !== editTarget.id));
      resetForm();
    } catch (err) {
      console.error("Unexpected error in handleDeleteJob:", err);
      alert("Something went wrong while deleting the job.");
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const updated = postings.find((p) => p.id === id);
    if (!updated) return;

    const { error } = await supabase
      .from("Applications")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Status update failed:", error.message);
      alert("Failed to update status.");
      return;
    }

    setPostings((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  const fetchJobDetails = async () => {
    if (!form.link) return;

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.link }),
      });

      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        title: data.title || "",
        company: data.company || "",
        location: data.location || "N/A",
      }));

      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>('input[placeholder="Job Title"]');
        firstInput?.focus();
      }, 50);
    } catch (err) {
      console.error("Scrape fetch error:", err);
      alert("Failed to fetch job info.");
    }
  };

  return (
    <div className="text-white min-h-screen flex flex-col items-center p-6 bg-gradient-to-b from-[#282828] to-[#343434]">
      <SignInButton />

      <div className="flex justify-between items-center justify-center w-full max-w-4xl mb-8 mt-8">
        {!session ? (
          <button
            className="mb-4 px-6 py-3 bg-black text-white rounded-[12px] cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          >
            Sign In with Google
          </button>
        ) : (
          <div className="mb-4 flex justify-between cursor-pointer w-full max-w-4xl">
            <span>Signed in as {session.user.email}</span>
            <button
              className="px-4 py-2 border rounded-xl cursor-pointer"
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <h1 className="text-6xl font-bold mb-6 text-center">Internship Tracker</h1>

      <Motivate />

      <div className="w-full max-w-4xl rounded-2xl shadow-lg bg-white/10 backdrop-blur-md border border-white/20">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-2xl font-bold">Applications</span>
          <button
            onClick={() => {
              setForm({ title: "", company: "", location: "", link: "", deadline: "" });
              setEditTarget(null);
              setShowModal(true);
            }}
            className="text-2xl text-white px-6 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 cursor-pointer shadow-lg hover:bg-white/20 transition"
          >
            +
          </button>
        </div>

        {/* Status Sections */}
        {statusLabels.map((label) => {
          const jobs = postings.filter((p) => p.status === label);
          return (
            <div key={label}>
              <button
                onClick={() => toggleExpand(label)}
                className="flex justify-between items-center w-full px-6 py-4 border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
              >
                <span className="text-xl">{label}</span>
                <span className="text-white text-sm border border-white/20 bg-white/10 px-3 py-1 rounded">
                  {jobs.length}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {expanded === label && (
                  <motion.div
                    key={label}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 py-4 space-y-4"
                  >
                    {jobs.length === 0 ? (
                      <div className="text-white/70 text-sm italic">
                        {label === "Saved" && "so dead in here..."}
                        {label === "Applied" && "Bro where are your applications???"}
                        {label === "Rejected" && "I'll buy you a bagel if you get >400"}
                        {label === "Interview" && "don't give up!!"}
                        {label === "Offer" && "keep grinding, you got this!"}
                      </div>
                    ) : (
                      jobs.map((job) => (
                        <motion.div
                          key={job.id}
                          layout
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            setEditTarget(job);
                            setForm({
                              title: job.title,
                              company: job.company,
                              location: job.location,
                              deadline: job.deadline || "",
                              link: job.link || "",
                            });
                            setShowModal(true);
                          }}
                          className="flex items-center justify-between h-16 rounded-lg bg-white/10 border border-white/20 shadow-md backdrop-blur-md px-4 cursor-pointer hover:bg-white/20 transition"
                        >
                          {/* Job Info */}
                          <div className="flex-1 min-w-[150px] truncate">
                            {job.link ? (
                              <a
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-medium text-white truncate hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {job.title}
                              </a>
                            ) : (
                              <span className="text-lg font-medium text-white truncate">
                                {job.title}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-[150px] text-lg font-medium text-white truncate">
                            {job.company}
                          </div>
                          <div className="flex-1 min-w-[120px] text-lg font-medium text-white truncate">
                            {job.location}
                          </div>
                          <div className="flex-1 min-w-[120px] text-lg font-medium text-white truncate">
                            {job.deadline || "—"}
                          </div>

                          {/* Status Dropdown */}
                          <div className="w-24 h-8 rounded-md flex items-center justify-center bg-white/10 border border-white/20 text-white text-sm font-medium shadow-md backdrop-blur-sm hover:bg-white/20 z-50">
                            <select
                              value={job.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateStatus(job.id, e.target.value)}
                              className="bg-transparent text-white text-sm font-medium w-full h-full text-center cursor-pointer outline-none"
                            >
                              {statusLabels.map((status) => (
                                <option key={status} value={status} className="text-black">
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>


      {showModal && (
        <div className="fixed inset-0 bg-[#282828] bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 rounded-lg shadow-lg w-[90%] max-w-xl bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editTarget ? "Edit Job Posting" : "Add a Job"}</h2>
              <button
                onClick={resetForm}
                className="text-white hover:text-gray-800 text-lg cursor-pointer"
              >✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.title.trim() || !form.company.trim() || !form.location.trim()) {
                  alert("All fields are required!");
                  return;
                }
                if (editTarget) handleUpdateJob();
                else handleAddJob();
              }}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <label className="text-sm text-white">Job Posting Link (optional)</label>
                <input
                  type="text"
                  placeholder="Paste job posting link"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="border p-2 w-full rounded"
                />
                {!editTarget && (
                  <button
                    type="button"
                    onClick={fetchJobDetails}
                    className="text-sm bg-black text-white border border-black rounded-xl px-4 py-2 w-48 hover:bg-opacity-60 transition-opacity duration-200 mx-auto text-center cursor-pointer"
                  >
                    Fetch Job Info
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Job Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border p-2 w-full rounded"
              />
              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="border p-2 w-full rounded"
              />
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="border p-2 w-full rounded"
              />
              <input
                type="text"
                placeholder="Deadline (e.g., May 3, 2025)"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="border p-2 w-full rounded"
              />

              <div className="flex justify-end gap-2 mt-6">
                {editTarget ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDeleteJob}
                      className="text-sm px-4 py-2 rounded border text-red-600 cursor-pointer hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                    <button
                      type="submit"
                      className="bg-black text-white text-sm px-4 py-2 rounded cursor-pointer hover:bg-opacity-60 transition-opacity"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm px-4 py-2 rounded-xl border cursor-pointer text-white hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-black text-white text-sm px-4 py-2 rounded-xl cursor-pointer hover:bg-opacity-60 transition-opacity"
                    >
                      Add
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
