export default function ConfiguracionPendiente() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-lg p-6 text-sm">
        <h1 className="mb-2 text-base font-semibold">Falta configurar Supabase</h1>
        <p className="text-zinc-500">
          Cree el archivo <code className="rounded bg-zinc-100 px-1 dark:bg-white/10">.env.local</code> a partir de
          <code className="mx-1 rounded bg-zinc-100 px-1 dark:bg-white/10">.env.example</code> con
          <b> VITE_SUPABASE_URL</b> y <b>VITE_SUPABASE_ANON_KEY</b>, y reinicie el servidor. En Vercel, defínalas en
          Project → Settings → Environment Variables.
        </p>
      </div>
    </div>
  );
}
