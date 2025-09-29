export default function TestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold mb-4">Тестовая страница</h1>
      <p className="text-muted-foreground mb-4">
        Эта страница используется для проверки стилей и функциональности.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 bg-card border rounded-lg">
          <h2 className="text-xl font-semibold text-card-foreground">Card компонент</h2>
          <p className="text-muted-foreground">Проверка цветов карточки</p>
        </div>
        
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          Primary Button
        </button>
        
        <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80">
          Secondary Button
        </button>
        
        <div className="p-4 bg-destructive text-destructive-foreground rounded-md">
          Destructive alert
        </div>
      </div>
    </div>
  )
}


