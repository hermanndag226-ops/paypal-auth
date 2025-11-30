import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Home, MessageCircle, Bell, User, Search, Image as ImageIcon, Heart, Share2, MoreHorizontal, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AuthModal } from "./auth-modal";
import { toast } from "sonner";

export function SocialFeed() {
  const [newPostContent, setNewPostContent] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Erreur de récupération de l'utilisateur");
      }
      return res.json().then(data => data.user);
    },
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Erreur de récupération des posts");
      return res.json().then(data => data.posts);
    },
    refetchInterval: 5000,
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur de création du post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
      toast.success("Post publié!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Erreur de déconnexion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast.success("Déconnexion réussie");
    },
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setAuthModalOpen(true);
    }
  }, [currentUser, userLoading]);

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    createPostMutation.mutate(newPostContent);
  };

  const posts = postsData || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={() => setAuthModalOpen(false)}
      />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-14 items-center justify-between max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-primary text-blue-600">SocialApp</h2>
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-8 bg-slate-100 border-none" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-600">
              <Home className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-600">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-600">
              <Bell className="h-5 w-5" />
            </Button>
            {currentUser ? (
              <>
                <Avatar className="h-8 w-8 border cursor-pointer">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setLocation("/settings")} 
                  className="text-slate-600"
                  data-testid="button-go-to-settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => logoutMutation.mutate()} className="text-slate-600">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button onClick={() => setAuthModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                Connexion
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        {currentUser && (
          <div className="hidden md:block md:col-span-3 space-y-4">
            <Card className="p-4 border-none shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground">{currentUser.handle}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="h-4 w-4" /> Profil
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Heart className="h-4 w-4" /> Favoris
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Main Feed */}
        <main className={`col-span-1 ${currentUser ? 'md:col-span-6' : 'md:col-span-9'} space-y-6`}>
          {/* Create Post */}
          {currentUser && (
            <Card className="p-4 border-none shadow-sm">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <Input 
                    placeholder={`Quoi de neuf, ${currentUser.name.split(' ')[0]} ?`}
                    className="bg-slate-50 border-none text-lg"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                    data-testid="input-new-post"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                        <ImageIcon className="h-4 w-4 text-green-500" /> Photo
                      </Button>
                    </div>
                    <Button 
                      onClick={handlePost} 
                      disabled={!newPostContent.trim() || createPostMutation.isPending} 
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                      data-testid="button-publish-post"
                    >
                      {createPostMutation.isPending ? "Publication..." : "Publier"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Posts Stream */}
          {postsLoading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Chargement...</p>
            </Card>
          ) : (
            <AnimatePresence>
              {posts.map((post: any) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-none shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                          <Avatar>
                            <AvatarImage src={post.author?.avatar} />
                            <AvatarFallback>{post.author?.name?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{post.author?.name || "Utilisateur"}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.author?.handle || "@user"} • {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">
                        {post.content}
                      </p>

                      {post.image && (
                        <div className="rounded-xl overflow-hidden mb-4">
                          <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
                        </div>
                      )}

                      <Separator className="my-3" />
                      
                      <div className="flex justify-between items-center text-muted-foreground">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 hover:text-red-500 hover:bg-red-50"
                          onClick={() => currentUser ? toggleLikeMutation.mutate(post.id) : setAuthModalOpen(true)}
                          data-testid={`button-like-${post.id}`}
                        >
                          <Heart className="h-4 w-4" /> {post.likesCount || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 hover:text-blue-500 hover:bg-blue-50">
                          <MessageCircle className="h-4 w-4" /> {post.commentsCount || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 hover:text-green-500 hover:bg-green-50">
                          <Share2 className="h-4 w-4" /> Partager
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </main>

        {/* Right Sidebar - Suggestions */}
        {currentUser && (
          <div className="hidden md:block md:col-span-3 space-y-4">
            <Card className="p-4 border-none shadow-sm">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Suggestions</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                        <div className="h-2 w-12 bg-slate-200 rounded animate-pulse" />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50">Suivre</Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
