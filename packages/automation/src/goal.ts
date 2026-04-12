export const AutomationGoalKind = {
  BuildPackage: "build-package",
  TestPackage: "test-package",
  LintWorkspace: "lint-workspace",
  ReleaseCheck: "release-check"
} as const;

export type AutomationGoalKindValue =
  (typeof AutomationGoalKind)[keyof typeof AutomationGoalKind];

export type BuildPackageGoal = {
  kind: typeof AutomationGoalKind.BuildPackage;
  packageName: string;
};

export type TestPackageGoal = {
  kind: typeof AutomationGoalKind.TestPackage;
  packageName: string;
};

export type LintWorkspaceGoal = {
  kind: typeof AutomationGoalKind.LintWorkspace;
};

export type ReleaseCheckGoal = {
  kind: typeof AutomationGoalKind.ReleaseCheck;
};

export type AutomationGoal =
  | BuildPackageGoal
  | TestPackageGoal
  | LintWorkspaceGoal
  | ReleaseCheckGoal;

export function buildPackageGoal(packageName: string): BuildPackageGoal {
  return {
    kind: AutomationGoalKind.BuildPackage,
    packageName
  };
}

export function testPackageGoal(packageName: string): TestPackageGoal {
  return {
    kind: AutomationGoalKind.TestPackage,
    packageName
  };
}

export function lintWorkspaceGoal(): LintWorkspaceGoal {
  return {
    kind: AutomationGoalKind.LintWorkspace
  };
}

export function releaseCheckGoal(): ReleaseCheckGoal {
  return {
    kind: AutomationGoalKind.ReleaseCheck
  };
}
