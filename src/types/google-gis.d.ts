interface Window {
  google: {
    accounts: {
      id: {
        initialize(config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          cancel_on_tap_outside?: boolean;
          auto_select?: boolean;
        }): void;
        renderButton(
          element: HTMLElement,
          options: {
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            width?: number;
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            shape?: "rectangular" | "pill";
            locale?: string;
          }
        ): void;
        prompt(): void;
        disableAutoSelect(): void;
        revoke(hint: string, done: () => void): void;
      };
    };
  };
}
