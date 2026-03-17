/* global fetch, document */
'use strict';

const BASE = '/api';

// ────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (res.status === 204) return null;
  return res.json().then(data => {
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.add('hidden'); }, 3000);
}

function fmtDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function emptyRow(cols, message = 'No records found') {
  return `<tr><td colspan="${cols}" class="empty-cell">${message}</td></tr>`;
}

// ────────────────────────────────────────────────
// Tabs
// ────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'dashboard') loadDashboard();
    if (btn.dataset.tab === 'students')  loadStudents();
    if (btn.dataset.tab === 'courses')   loadCourses();
    if (btn.dataset.tab === 'enrollments') loadEnrollments();
  });
});

// ────────────────────────────────────────────────
// Dashboard
// ────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await api('GET', '/dashboard');

    document.getElementById('stat-students').textContent    = data.stats.students;
    document.getElementById('stat-courses').textContent     = data.stats.courses;
    document.getElementById('stat-enrollments').textContent = data.stats.enrollments;

    const sTbody = document.querySelector('#recent-students-table tbody');
    sTbody.innerHTML = data.recentStudents.length
      ? data.recentStudents.map(s => `<tr><td>${escHtml(s.name)}</td><td>${escHtml(s.email)}</td><td>${s.phone ? escHtml(s.phone) : '—'}</td></tr>`).join('')
      : emptyRow(3);

    const cTbody = document.querySelector('#recent-courses-table tbody');
    cTbody.innerHTML = data.recentCourses.length
      ? data.recentCourses.map(c => `<tr><td>${escHtml(c.title)}</td><td>${escHtml(c.instructor)}</td><td>${c.duration ? escHtml(c.duration) : '—'}</td></tr>`).join('')
      : emptyRow(3);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ────────────────────────────────────────────────
// Students
// ────────────────────────────────────────────────
async function loadStudents() {
  try {
    const students = await api('GET', '/students');
    const tbody = document.querySelector('#students-table tbody');
    if (!students.length) {
      tbody.innerHTML = emptyRow(5);
      return;
    }
    tbody.innerHTML = students.map(s => `<tr>
      <td>${escHtml(s.name)}</td>
      <td>${escHtml(s.email)}</td>
      <td>${s.phone ? escHtml(s.phone) : '—'}</td>
      <td>${s.enrollment_count}</td>
      <td class="action-btns">
        <button class="btn btn-edit" onclick="editStudent(${s.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteStudent(${s.id})">Delete</button>
      </td>
    </tr>`).join('');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.getElementById('add-student-btn').addEventListener('click', () => {
  document.getElementById('student-form-title').textContent = 'Add Student';
  document.getElementById('student-id').value    = '';
  document.getElementById('student-name').value  = '';
  document.getElementById('student-email').value = '';
  document.getElementById('student-phone').value = '';
  document.getElementById('student-form-container').classList.remove('hidden');
});

document.getElementById('cancel-student-btn').addEventListener('click', () => {
  document.getElementById('student-form-container').classList.add('hidden');
});

async function editStudent(id) {
  try {
    const s = await api('GET', `/students/${id}`);
    document.getElementById('student-form-title').textContent = 'Edit Student';
    document.getElementById('student-id').value    = s.id;
    document.getElementById('student-name').value  = s.name;
    document.getElementById('student-email').value = s.email;
    document.getElementById('student-phone').value = s.phone || '';
    document.getElementById('student-form-container').classList.remove('hidden');
    document.getElementById('student-form-container').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.getElementById('student-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id    = document.getElementById('student-id').value;
  const name  = document.getElementById('student-name').value.trim();
  const email = document.getElementById('student-email').value.trim();
  const phone = document.getElementById('student-phone').value.trim();
  try {
    if (id) {
      await api('PUT', `/students/${id}`, { name, email, phone: phone || null });
      showToast('Student updated');
    } else {
      await api('POST', '/students', { name, email, phone: phone || null });
      showToast('Student added');
    }
    document.getElementById('student-form-container').classList.add('hidden');
    loadStudents();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

async function deleteStudent(id) {
  if (!confirm('Delete this student? This will also remove all their enrollments.')) return;
  try {
    await api('DELETE', `/students/${id}`);
    showToast('Student deleted');
    loadStudents();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ────────────────────────────────────────────────
// Courses
// ────────────────────────────────────────────────
async function loadCourses() {
  try {
    const courses = await api('GET', '/courses');
    const tbody = document.querySelector('#courses-table tbody');
    if (!courses.length) {
      tbody.innerHTML = emptyRow(5);
      return;
    }
    tbody.innerHTML = courses.map(c => `<tr>
      <td>${escHtml(c.title)}</td>
      <td>${escHtml(c.instructor)}</td>
      <td>${c.duration ? escHtml(c.duration) : '—'}</td>
      <td>${c.student_count}</td>
      <td class="action-btns">
        <button class="btn btn-edit" onclick="editCourse(${c.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteCourse(${c.id})">Delete</button>
      </td>
    </tr>`).join('');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.getElementById('add-course-btn').addEventListener('click', () => {
  document.getElementById('course-form-title').textContent   = 'Add Course';
  document.getElementById('course-id').value          = '';
  document.getElementById('course-title').value       = '';
  document.getElementById('course-description').value = '';
  document.getElementById('course-instructor').value  = '';
  document.getElementById('course-duration').value    = '';
  document.getElementById('course-form-container').classList.remove('hidden');
});

document.getElementById('cancel-course-btn').addEventListener('click', () => {
  document.getElementById('course-form-container').classList.add('hidden');
});

async function editCourse(id) {
  try {
    const c = await api('GET', `/courses/${id}`);
    document.getElementById('course-form-title').textContent   = 'Edit Course';
    document.getElementById('course-id').value          = c.id;
    document.getElementById('course-title').value       = c.title;
    document.getElementById('course-description').value = c.description || '';
    document.getElementById('course-instructor').value  = c.instructor;
    document.getElementById('course-duration').value    = c.duration || '';
    document.getElementById('course-form-container').classList.remove('hidden');
    document.getElementById('course-form-container').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.getElementById('course-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id          = document.getElementById('course-id').value;
  const title       = document.getElementById('course-title').value.trim();
  const description = document.getElementById('course-description').value.trim();
  const instructor  = document.getElementById('course-instructor').value.trim();
  const duration    = document.getElementById('course-duration').value.trim();
  try {
    if (id) {
      await api('PUT', `/courses/${id}`, { title, description, instructor, duration });
      showToast('Course updated');
    } else {
      await api('POST', '/courses', { title, description, instructor, duration });
      showToast('Course added');
    }
    document.getElementById('course-form-container').classList.add('hidden');
    loadCourses();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

async function deleteCourse(id) {
  if (!confirm('Delete this course? Enrolled students will be unenrolled.')) return;
  try {
    await api('DELETE', `/courses/${id}`);
    showToast('Course deleted');
    loadCourses();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ────────────────────────────────────────────────
// Enrollments
// ────────────────────────────────────────────────
async function loadEnrollments() {
  try {
    const [students, courses] = await Promise.all([
      api('GET', '/students'),
      api('GET', '/courses')
    ]);

    // Populate dropdowns
    const sSel = document.getElementById('enroll-student');
    const cSel = document.getElementById('enroll-course');
    sSel.innerHTML = '<option value="">— Select student —</option>' +
      students.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
    cSel.innerHTML = '<option value="">— Select course —</option>' +
      courses.map(c => `<option value="${c.id}">${escHtml(c.title)}</option>`).join('');

    // Build enrollment list
    const allRows = [];
    for (const s of students) {
      const enrols = await api('GET', `/students/${s.id}/enrollments`);
      for (const c of enrols) {
        allRows.push({ student: s, course: c, enrolled_at: c.enrolled_at });
      }
    }
    allRows.sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at));

    const tbody = document.querySelector('#enrollments-table tbody');
    tbody.innerHTML = allRows.length
      ? allRows.map(r => `<tr>
          <td>${escHtml(r.student.name)}</td>
          <td>${escHtml(r.course.title)}</td>
          <td>${escHtml(r.course.instructor)}</td>
          <td>${fmtDate(r.enrolled_at)}</td>
          <td>
            <button class="btn btn-danger" onclick="unenroll(${r.student.id}, ${r.course.id})">Remove</button>
          </td>
        </tr>`).join('')
      : emptyRow(5);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.getElementById('enroll-btn').addEventListener('click', () => {
  document.getElementById('enrollment-form-container').classList.remove('hidden');
});
document.getElementById('cancel-enroll-btn').addEventListener('click', () => {
  document.getElementById('enrollment-form-container').classList.add('hidden');
});

document.getElementById('enrollment-form').addEventListener('submit', async e => {
  e.preventDefault();
  const student_id = document.getElementById('enroll-student').value;
  const course_id  = document.getElementById('enroll-course').value;
  if (!student_id || !course_id) {
    showToast('Please select both a student and a course', 'error');
    return;
  }
  try {
    await api('POST', '/enrollments', { student_id: Number(student_id), course_id: Number(course_id) });
    showToast('Student enrolled');
    document.getElementById('enrollment-form-container').classList.add('hidden');
    loadEnrollments();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

async function unenroll(studentId, courseId) {
  if (!confirm('Remove this enrollment?')) return;
  try {
    await api('DELETE', '/enrollments', { student_id: studentId, course_id: courseId });
    showToast('Enrollment removed');
    loadEnrollments();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ────────────────────────────────────────────────
// Init
// ────────────────────────────────────────────────
loadDashboard();
