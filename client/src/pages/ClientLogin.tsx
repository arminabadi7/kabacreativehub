import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export default function ClientLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/auth/login", {
        emailOrUsername: data.emailOrUsername,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.userType === "client") {
        queryClient.invalidateQueries({ queryKey: ["/api/clients/session"] });
        toast({
          title: "Success!",
          description: "You've been logged in.",
        });
        setLocation("/client");
      } else {
        toast({
          title: "Invalid Account",
          description: "Please use the correct login page for your account type.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email/username or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      emailOrUsername,
      password,
      rememberMe,
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 mb-4">
        <img src="/logo.png" alt="KabaContent" className="w-10 h-10 rounded-lg" />
        <span className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Kaba</span>
          <span className="text-gray-900">Content</span>
        </span>
      </div>

      <Card className="w-full max-w-md shadow-sm border border-gray-200">
        <CardContent className="pt-8 pb-8 px-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Client Login</h1>
          <p className="text-gray-600 mb-8">Access your client dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername" className="text-gray-900">Email or Username</Label>
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="Enter your email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-900"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



