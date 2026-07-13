package com.datct.datn.modules.seed.service;

import com.datct.datn.modules.course.entity.Semester;
import com.datct.datn.modules.course.repository.SemesterRepository;
import com.datct.datn.modules.enrollment.entity.PreRegistration;
import com.datct.datn.modules.enrollment.repository.PreRegistrationRepository;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import com.datct.datn.modules.user.entity.Department;
import com.datct.datn.modules.user.entity.Role;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.DepartmentRepository;
import com.datct.datn.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class DataSeederService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private PreRegistrationRepository preRegistrationRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private SemesterRepository semesterRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public String seedPreRegistrations(Long semesterId, int numStudents, int maxSubjects) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học kỳ"));

        List<Subject> allSubjects = new ArrayList<>(subjectRepository.findAll());
        if (allSubjects.isEmpty()) {
            throw new RuntimeException("Không có môn học nào trong DB để seed.");
        }
        Collections.shuffle(allSubjects);

        int hotCount = Math.min(20, allSubjects.size());
        List<Subject> hotSubjects = new ArrayList<>(allSubjects.subList(0, hotCount));
        List<Subject> regularSubjects = new ArrayList<>(allSubjects.subList(hotCount, allSubjects.size()));

        Department department = departmentRepository.findAll().stream().findFirst().orElse(null);

        String defaultPasswordHash = passwordEncoder.encode("123456");

        List<User> usersToSave = new ArrayList<>();
        List<Student> studentsToSave = new ArrayList<>();
        List<PreRegistration> preRegistrationsToSave = new ArrayList<>();

        for (int i = 0; i < numStudents; i++) {
            int index = i + 1;
            String email = "test" + index + "@gmail.com";
            String studentCode = "TEST_" + index;

            User user = userRepository.findByEmail(email).orElse(null);
            Student student = null;
            if (user != null) {
                student = studentRepository.findByUserId(user.getId()).orElse(null);
            } else {
                user = new User();
                user.setEmail(email);
            }
            user.setFullName("Test Student " + index);
            user.setPassword(defaultPasswordHash);
            user.setRole(Role.STUDENT);
            usersToSave.add(user);

            if (student == null) {
                student = studentRepository.findByStudentCode(studentCode).orElse(new Student());
            } else if (student.getId() != null) {
                List<PreRegistration> existingPrs = preRegistrationRepository.findByStudentId(student.getId());
                if (!existingPrs.isEmpty()) {
                    preRegistrationRepository.deleteAll(existingPrs);
                }
            }
            student.setUser(user);
            student.setStudentCode(studentCode);
            student.setDepartment(department);
            studentsToSave.add(student);

            int subjectsCount = (int) (Math.random() * maxSubjects) + 1;
            if (subjectsCount > allSubjects.size()) {
                subjectsCount = allSubjects.size();
            }

            int targetHotCount = (int) Math.round(subjectsCount * 0.8);
            if (targetHotCount < 1 && !hotSubjects.isEmpty()) {
                targetHotCount = 1;
            }
            if (targetHotCount > hotSubjects.size()) {
                targetHotCount = hotSubjects.size();
            }
            int targetRegularCount = subjectsCount - targetHotCount;
            if (targetRegularCount > regularSubjects.size()) {
                targetRegularCount = regularSubjects.size();
            }

            Set<Long> pickedSubjectIds = new HashSet<>();
            List<Subject> shuffledHot = new ArrayList<>(hotSubjects);
            Collections.shuffle(shuffledHot);
            for (int j = 0; j < targetHotCount; j++) {
                Subject s = shuffledHot.get(j);
                if (pickedSubjectIds.add(s.getId())) {
                    PreRegistration pr = new PreRegistration();
                    pr.setStudent(student);
                    pr.setSemester(semester);
                    pr.setSubject(s);
                    preRegistrationsToSave.add(pr);
                }
            }

            List<Subject> shuffledRegular = new ArrayList<>(regularSubjects);
            Collections.shuffle(shuffledRegular);
            for (int j = 0; j < targetRegularCount; j++) {
                Subject s = shuffledRegular.get(j);
                if (pickedSubjectIds.add(s.getId())) {
                    PreRegistration pr = new PreRegistration();
                    pr.setStudent(student);
                    pr.setSemester(semester);
                    pr.setSubject(s);
                    preRegistrationsToSave.add(pr);
                }
            }
        }

        userRepository.saveAll(usersToSave);
        studentRepository.saveAll(studentsToSave);
        preRegistrationRepository.saveAll(preRegistrationsToSave);

        return "Đã tạo thành công " + numStudents + " sinh viên test (test1@gmail.com -> test" + numStudents + "@gmail.com) và " + preRegistrationsToSave.size() + " bản ghi nguyện vọng.";
    }

    @Transactional
    public String clearSeedData() {
        List<Student> dummyStudents = studentRepository.findAll().stream()
                .filter(s -> s.getStudentCode() != null && (s.getStudentCode().startsWith("DUMMY_") || s.getStudentCode().startsWith("TEST_")))
                .toList();

        if (dummyStudents.isEmpty()) {
            return "Không tìm thấy dữ liệu giả lập/test nào để xóa.";
        }

        int studentCount = dummyStudents.size();
        int preRegCount = 0;

        for (Student student : dummyStudents) {
            List<PreRegistration> prs = preRegistrationRepository.findByStudentId(student.getId());
            preRegCount += prs.size();
            preRegistrationRepository.deleteAll(prs);
            
            studentRepository.delete(student);
            if (student.getUser() != null) {
                userRepository.delete(student.getUser());
            }
        }

        return "Đã xóa thành công " + studentCount + " sinh viên test và " + preRegCount + " bản ghi nguyện vọng.";
    }
}
