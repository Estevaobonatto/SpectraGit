import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Eye, EyeOff, Save } from 'lucide-react';
import {
  useMyProfile,
  useUpdateProfileCustomization,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateSocialLink,
  useDeleteSocialLink,
  usePinRepository,
  useUnpinRepository,
  useCreateSkill,
  useDeleteSkill,
  useCreateProject,
  useDeleteProject,
} from '@/hooks/useProfile';
import { useRepositories } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { PageLoader } from '@/components/ui/spinner';
import { motion } from 'motion/react';

export default function ProfileCustomizationSection() {
  const { data: profile, isLoading } = useMyProfile();
  const updateCustomization = useUpdateProfileCustomization();
  const { data: repos } = useRepositories();

  // Form state
  const [readmeContent, setReadmeContent] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [backgroundType, setBackgroundType] = useState('solid');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [customCss, setCustomCss] = useState('');
  const [commitChartColor, setCommitChartColor] = useState('');
  const [commitChartStyle, setCommitChartStyle] = useState('default');
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section dialog
  const [sectionDialog, setSectionDialog] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionContent, setSectionContent] = useState('');
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  // Social link dialog
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkPlatform, setLinkPlatform] = useState('custom');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const createSocialLink = useCreateSocialLink();
  const deleteSocialLink = useDeleteSocialLink();

  // Pin repos
  const pinRepository = usePinRepository();
  const unpinRepository = useUnpinRepository();

  // Skills
  const [skillDialog, setSkillDialog] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillProficiency, setSkillProficiency] = useState(50);
  const [skillProjects, setSkillProjects] = useState('');
  const createSkill = useCreateSkill();
  const deleteSkill = useDeleteSkill();

  // Projects
  const [projectDialog, setProjectDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectRepoUrl, setProjectRepoUrl] = useState('');
  const [projectLiveUrl, setProjectLiveUrl] = useState('');
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (profile) {
      setReadmeContent(profile.readmeContent ?? '');
      setAboutMe(profile.aboutMe ?? '');
      setBackgroundType(profile.backgroundType ?? 'solid');
      setBackgroundColor(profile.backgroundColor ?? '');
      setBackgroundImage(profile.backgroundImage ?? '');
      setCustomCss(profile.customCss ?? '');
      setCommitChartColor(profile.commitChartColor ?? '');
      setCommitChartStyle(profile.commitChartStyle ?? 'default');
      setDirty(false);
    }
  }, [profile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isLoading) return <PageLoader />;

  const handleSave = () => {
    setError(null);
    setSuccess(false);
    updateCustomization.mutate(
      {
        readmeContent: readmeContent || undefined,
        aboutMe: aboutMe || undefined,
        backgroundType,
        backgroundColor: backgroundColor || undefined,
        backgroundImage: backgroundImage || undefined,
        customCss: customCss || undefined,
        commitChartColor: commitChartColor || undefined,
        commitChartStyle,
      },
      {
        onSuccess: () => { setDirty(false); setSuccess(true); },
        onError: (err) => setError((err as Error)?.message ?? 'Failed to save'),
      },
    );
  };

  const repoList = repos?.data ?? [];
  const pinnedRepoIds = new Set(profile?.pinnedRepos?.map((p) => p.repository.id) ?? []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="pinned">Pinned Repos</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* ── Content ─────────────────────────────────────── */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile README</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="readme">Main Description (Markdown)</Label>
                <Textarea
                  id="readme"
                  value={readmeContent}
                  onChange={(e) => { setReadmeContent(e.target.value); setDirty(true); }}
                  placeholder="# Hello World&#10;&#10;Welcome to my profile! Write your main description here using Markdown..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aboutMe">About Me (Markdown)</Label>
                <Textarea
                  id="aboutMe"
                  value={aboutMe}
                  onChange={(e) => { setAboutMe(e.target.value); setDirty(true); }}
                  placeholder="Tell visitors about yourself..."
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handleSave} disabled={updateCustomization.isPending || !dirty}>
                <Save className="h-4 w-4 mr-1" />
                Save Content
              </Button>
              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">Saved successfully.</Alert>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance ──────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Background Type</Label>
                <Select value={backgroundType} onValueChange={(v) => { setBackgroundType(v); setDirty(true); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid Color</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="css">Custom CSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {backgroundType === 'solid' && (
                <div className="space-y-2">
                  <Label htmlFor="bgColor">Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={backgroundColor || '#1e1e2e'}
                      onChange={(e) => { setBackgroundColor(e.target.value); setDirty(true); }}
                      className="h-10 w-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      id="bgColor"
                      value={backgroundColor}
                      onChange={(e) => { setBackgroundColor(e.target.value); setDirty(true); }}
                      placeholder="#1e1e2e"
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {backgroundType === 'image' && (
                <div className="space-y-2">
                  <Label htmlFor="bgImage">Background Image URL</Label>
                  <Input
                    id="bgImage"
                    value={backgroundImage}
                    onChange={(e) => { setBackgroundImage(e.target.value); setDirty(true); }}
                    placeholder="https://example.com/background.jpg"
                  />
                </div>
              )}

              {backgroundType === 'css' && (
                <div className="space-y-2">
                  <Label htmlFor="customCss">Custom CSS</Label>
                  <Textarea
                    id="customCss"
                    value={customCss}
                    onChange={(e) => { setCustomCss(e.target.value); setDirty(true); }}
                    placeholder="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);&#10;border-radius: 12px;&#10;padding: 24px;"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-text-tertiary">
                    Note: position:fixed, position:absolute, z-index, javascript:, and expression() are not allowed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commit Chart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chart Style</Label>
                <Select value={commitChartStyle} onValueChange={(v) => { setCommitChartStyle(v); setDirty(true); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (Purple)</SelectItem>
                    <SelectItem value="warm">Warm (Yellow → Red)</SelectItem>
                    <SelectItem value="cool">Cool (Blue)</SelectItem>
                    <SelectItem value="neon">Neon (Green)</SelectItem>
                    <SelectItem value="custom">Custom Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {commitChartStyle === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="chartColor">Chart Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={commitChartColor || '#7C3AED'}
                      onChange={(e) => { setCommitChartColor(e.target.value); setDirty(true); }}
                      className="h-10 w-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      id="chartColor"
                      value={commitChartColor}
                      onChange={(e) => { setCommitChartColor(e.target.value); setDirty(true); }}
                      placeholder="#7C3AED"
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSave} disabled={updateCustomization.isPending || !dirty}>
                <Save className="h-4 w-4 mr-1" />
                Save Appearance
              </Button>
              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">Saved successfully.</Alert>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sections ────────────────────────────────────── */}
        <TabsContent value="sections" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Custom Sections</CardTitle>
              <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Section</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Section</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Experience" />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (Markdown)</Label>
                      <Textarea value={sectionContent} onChange={(e) => setSectionContent(e.target.value)} placeholder="Write section content in markdown..." rows={8} className="font-mono text-sm" />
                    </div>
                    <Button
                      onClick={() => {
                        createSection.mutate({ title: sectionTitle, content: sectionContent }, {
                          onSuccess: () => { setSectionDialog(false); setSectionTitle(''); setSectionContent(''); },
                        });
                      }}
                      disabled={createSection.isPending || !sectionTitle.trim() || !sectionContent.trim()}
                    >
                      Add Section
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {profile?.sections && profile.sections.length > 0 ? (
                <div className="divide-y divide-border">
                  {profile.sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-start gap-3 py-3"
                    >
                      <GripVertical className="h-4 w-4 text-text-tertiary mt-1 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{section.title}</p>
                          {!section.isVisible && <Badge variant="secondary" className="text-[10px]">Hidden</Badge>}
                        </div>
                        <p className="text-xs text-text-tertiary line-clamp-2 mt-0.5">{section.content.slice(0, 100)}...</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateSection.mutate({ id: section.id, isVisible: !section.isVisible })}
                      >
                        {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteSection.mutate(section.id)}
                      >
                        <Trash2 className="h-4 w-4 text-error" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">No custom sections added yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Social Links ────────────────────────────────── */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Social Links</CardTitle>
              <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Link</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Social Link</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select value={linkPlatform} onValueChange={setLinkPlatform}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="twitter">Twitter / X</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="portfolio">Portfolio</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="My Twitter" />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://twitter.com/username" />
                    </div>
                    <Button
                      onClick={() => {
                        createSocialLink.mutate({ platform: linkPlatform, label: linkLabel, url: linkUrl }, {
                          onSuccess: () => { setLinkDialog(false); setLinkLabel(''); setLinkUrl(''); },
                        });
                      }}
                      disabled={createSocialLink.isPending || !linkLabel.trim() || !linkUrl.trim()}
                    >
                      Add Link
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {profile?.socialLinks && profile.socialLinks.length > 0 ? (
                <div className="divide-y divide-border">
                  {profile.socialLinks.map((link, index) => (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{link.label}</p>
                        <p className="text-xs text-text-tertiary">{link.platform} &middot; {link.url}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteSocialLink.mutate(link.id)}>
                        <Trash2 className="h-4 w-4 text-error" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">No social links added yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pinned Repos ────────────────────────────────── */}
        <TabsContent value="pinned" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pinned Repositories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-tertiary">Select up to 6 repositories to pin on your profile page.</p>

              {/* Current pins */}
              {profile?.pinnedRepos && profile.pinnedRepos.length > 0 && (
                <div className="space-y-2">
                  <Label>Currently Pinned</Label>
                  <div className="divide-y divide-border">
                    {profile.pinnedRepos.map((pin) => (
                      <div key={pin.id} className="flex items-center gap-3 py-2">
                        <span className="text-sm font-medium flex-1">{pin.repository.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{pin.repository.visibility}</Badge>
                        <Button size="icon" variant="ghost" onClick={() => unpinRepository.mutate(pin.repository.id)}>
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available repos to pin */}
              <div className="space-y-2">
                <Label>Available Repositories</Label>
                <div className="max-h-60 overflow-y-auto divide-y divide-border border border-border rounded-[var(--radius-md)]">
                  {repoList
                    .filter((r) => !pinnedRepoIds.has(r.id))
                    .map((repo) => (
                      <div key={repo.id} className="flex items-center gap-3 px-3 py-2">
                        <span className="text-sm flex-1">{repo.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{repo.visibility}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pinRepository.mutate({ repositoryId: repo.id })}
                          disabled={pinRepository.isPending || (profile?.pinnedRepos?.length ?? 0) >= 6}
                        >
                          Pin
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Skills ──────────────────────────────────────── */}
        <TabsContent value="skills" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Skills</CardTitle>
              <Dialog open={skillDialog} onOpenChange={setSkillDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Skill</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Skill</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Skill Name</Label>
                      <Input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="React, TypeScript, Python..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Proficiency ({skillProficiency}%)</Label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={skillProficiency}
                        onChange={(e) => setSkillProficiency(Number(e.target.value))}
                        className="w-full"
                      />
                      <Progress value={skillProficiency} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <Label>Related Projects (comma-separated)</Label>
                      <Input value={skillProjects} onChange={(e) => setSkillProjects(e.target.value)} placeholder="my-app, portfolio, api-server" />
                    </div>
                    <Button
                      onClick={() => {
                        createSkill.mutate({
                          name: skillName,
                          proficiency: skillProficiency,
                          relatedProjects: skillProjects ? skillProjects.split(',').map((s) => s.trim()).filter(Boolean) : [],
                        }, {
                          onSuccess: () => { setSkillDialog(false); setSkillName(''); setSkillProficiency(50); setSkillProjects(''); },
                        });
                      }}
                      disabled={createSkill.isPending || !skillName.trim()}
                    >
                      Add Skill
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="space-y-3">
                  {profile.skills.map((skill, index) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <span className="text-xs text-text-tertiary">{skill.proficiency}%</span>
                        </div>
                        <Progress value={skill.proficiency} className="h-1.5" />
                        {skill.relatedProjects.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {skill.relatedProjects.map((p) => (
                              <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteSkill.mutate(skill.id)}>
                        <Trash2 className="h-4 w-4 text-error" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">No skills added yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Projects ────────────────────────────────────── */}
        <TabsContent value="projects" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Project</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="My Awesome Project" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="A brief description..." rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Repository URL</Label>
                        <Input value={projectRepoUrl} onChange={(e) => setProjectRepoUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Live URL</Label>
                        <Input value={projectLiveUrl} onChange={(e) => setProjectLiveUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        createProject.mutate({
                          name: projectName,
                          description: projectDesc || undefined,
                          repoUrl: projectRepoUrl || undefined,
                          liveUrl: projectLiveUrl || undefined,
                        }, {
                          onSuccess: () => { setProjectDialog(false); setProjectName(''); setProjectDesc(''); setProjectRepoUrl(''); setProjectLiveUrl(''); },
                        });
                      }}
                      disabled={createProject.isPending || !projectName.trim()}
                    >
                      Add Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {profile?.projects && profile.projects.length > 0 ? (
                <div className="divide-y divide-border">
                  {profile.projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-start gap-3 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{project.name}</p>
                        {project.description && <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{project.description}</p>}
                        <div className="flex gap-2 mt-1 text-xs text-text-tertiary">
                          {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">Repo</a>}
                          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">Live</a>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteProject.mutate(project.id)}>
                        <Trash2 className="h-4 w-4 text-error" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">No projects added yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
