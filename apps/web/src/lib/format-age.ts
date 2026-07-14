export function formatAge(dateOfBirth: string | null, ageIsApprox: boolean): string {
  if (!dateOfBirth) {
    return "Age unknown";
  }

  const dob = new Date(dateOfBirth);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const prefix = ageIsApprox ? "~" : "";
  if (years <= 0) {
    return `${prefix}${months}m`;
  }
  return `${prefix}${years}y ${months}m`;
}
