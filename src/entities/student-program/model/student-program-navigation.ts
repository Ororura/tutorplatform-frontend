export function studentProgramHref(programId: string, topicId?: string) {
  const href = `/student/programs/${programId}`;
  return topicId ? `${href}/topics/${topicId}` : href;
}
