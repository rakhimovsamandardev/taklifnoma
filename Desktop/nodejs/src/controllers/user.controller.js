/**
 * Thin wrapper for future user/profile reads. Middleware + services cover creation today.
 */
export class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  getLanguage(userId) {
    return this.userService.getLanguage(userId);
  }
}
