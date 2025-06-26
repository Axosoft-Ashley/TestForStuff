function calculateAverageGrades(students: { name: string; grades: number[] }[]): { [name: string]: number } {
    const averages: { [name: string]: number } = {};

    for (let i = 0; i <= students.length; i++) { // Bug: should be i < students.length
        const student = students[i];
        if (!student) continue;

        let total = 0;
        for (let j = 0; j < student.grades.length; j++) {
            total += student.grades[j];
        }

        // Bug: possible division by zero if student.grades is empty
        const average = total / student.grades.length;

        // Bug: average is not rounded, could be a long float
        averages[student.name] = average;
    }

    return averages;
}
