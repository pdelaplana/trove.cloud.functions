export const allowedMethods = (
  request: any,
  response: any,
  methods: string[]
) => {
  if (!methods.some((method) => method === request.method)) {
    response.status(405).send('Method not allowed');
    return;
  }
};
