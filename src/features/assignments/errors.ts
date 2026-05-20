type SupabaseLikeError = { code?: string; message?: string };

export function mapAssignmentError(error: SupabaseLikeError): Error {
  const code = error.code ?? '';
  const message = error.message ?? 'Assignment operation failed';

  if (code === '23505') {
    return new Error(
      'This participant is already assigned to this resource. Choose a different participant or remove the existing assignment.'
    );
  }

  if (
    message.includes('trac_itinerary_assignment_validate_resource') ||
    message.includes('resource') ||
    code === 'P0001'
  ) {
    return new Error(
      'The selected resource could not be found or does not match the resource type. Choose a valid logistics row and try again.'
    );
  }

  return new Error(message);
}
