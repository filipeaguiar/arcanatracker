export const dictionaries = {
  pt: {
    common: {
      dashboard: "Dashboard",
      cards: "Cartões",
      invoices: "Faturas",
      logout: "Sair",
      loading: "Carregando...",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Acompanhe sua saúde financeira em tempo real.",
      quickInput: "Entrada Rápida",
      recentTransactions: "Transações Recentes",
      balance: "Saldo Total",
      income: "Receitas",
      expense: "Despesas",
    },
    login: {
      welcome: "Bem-vindo ao Tracker",
      subtitle: "O controle financeiro que não te atrasa.",
      email: "E-mail",
      password: "Senha",
      enter: "Entrar",
      createAccount: "Criar Conta",
    }
  },
  en: {
    common: {
      dashboard: "Dashboard",
      cards: "Cards",
      invoices: "Invoices",
      logout: "Logout",
      loading: "Loading...",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Track your financial health in real-time.",
      quickInput: "Quick Input",
      recentTransactions: "Recent Transactions",
      balance: "Total Balance",
      income: "Income",
      expense: "Expenses",
    },
    login: {
      welcome: "Welcome to Tracker",
      subtitle: "Financial control that doesn't slow you down.",
      email: "Email",
      password: "Password",
      enter: "Login",
      createAccount: "Sign Up",
    }
  }
};

export type Locale = keyof typeof dictionaries;

export function getDictionary(locale: Locale = "pt") {
  return dictionaries[locale] || dictionaries.pt;
}
