declare module 'update-notifier' {
  function updateNotifier (options: updateNotifier.Options): updateNotifier.Result;

  module updateNotifier {
    interface Options {
      pkg: {
        name: string;
        version: string;
      }
      updateCheckInterval?: number;
    }

    interface Result {
      notify (): void;
      update: UpdateInfo;
    }

    interface UpdateInfo {
      latest: string;
      current: string;
      type: string;
      date: string;
      name: string;
    }
  }

  export = updateNotifier;
}
