"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

export default function Home() {
  const [todos, setTodos] = useState<any[]>([]);

  useEffect(() => {
    const fetchTodos = async () => {
      const { data, error } = await supabase.from("todos").select("*");
      if (error) {
        console.error(error);
      } else {
        setTodos(data || []);
      }
    };
    fetchTodos();
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Todos一覧</h1>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </main>
  );
}
