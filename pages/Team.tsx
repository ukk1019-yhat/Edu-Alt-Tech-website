import React from 'react';
import { Linkedin, Mail, Users, TrendingUp, Lightbulb, Code, Palette, Megaphone, Brain, ArrowRight } from 'lucide-react';
import { TEAM } from '../constants';
import { Link } from 'react-router-dom';

const Team: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans selection:bg-emerald-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-8 pb-2 tracking-tight">
            The Minds Reimagining Education
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            We are a collective of innovators, engineers, and educators driven by a singular mission: to bridge the execution gap and empower the next generation of builders.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {TEAM.map((member, idx) => (
            <div 
              key={idx} 
              className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 animate-float"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Gradient Overlay - Always dark at bottom for readability on mobile, transitions on desktop */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90 lg:opacity-70 lg:group-hover:opacity-90 transition-opacity duration-500" />
                
                {/* Social Links on Hover (Always visible on mobile) */}
                <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-x-0 lg:translate-x-4 lg:group-hover:translate-x-0 transition-all duration-500">
                  <a href={`mailto:${member.email}`} className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-emerald-500 hover:text-white transition-colors duration-300">
                    <Mail className="w-5 h-5" />
                  </a>
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-[#0A66C2] hover:text-white transition-colors duration-300">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 transform translate-y-0 lg:translate-y-8 lg:group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">{member.specialization}</p>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1 lg:group-hover:text-emerald-300 transition-colors">{member.name}</h3>
                  <p className="text-slate-300 font-medium text-sm mb-3 lg:mb-4">{member.role}</p>
                  
                  {/* Bio appears on hover for desktop, always visible on mobile */}
                  <div className="h-auto lg:h-0 lg:group-hover:h-auto overflow-hidden transition-all duration-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                    <p className="text-slate-200 text-sm line-clamp-3 lg:line-clamp-2 mt-2 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vision & Culture */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Our Culture & Vision</h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto">The core principles that guide our everyday decisions and long-term ambitions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Vision</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">To create an ecosystem where real-world skills are accessible to everyone, fundamentally shifting how technology education is delivered.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Work Style</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">Collaborative, fast-paced, and highly accountable. We believe in peer-to-peer growth, where every member is both a learner and a mentor.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Impact</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">Our focus is measurable outcomes. We don't just build software blueprints; we build builders who go on to create impactful solutions.</p>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-32 bg-slate-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Collective Expertise</h2>
              <p className="text-slate-400 text-xl mb-8 leading-relaxed">
                We bring together diverse technical and creative skills to build comprehensive, cutting-edge educational solutions. Our team thrives at the intersection of powerful tech and human-centered design.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <p className="text-4xl font-bold text-emerald-400 mb-2">9+</p>
                  <p className="text-slate-300">Specialized Disciplines</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <p className="text-4xl font-bold text-blue-400 mb-2">100%</p>
                  <p className="text-slate-300">Impact Driven</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 bg-black/20 p-8 rounded-3xl backdrop-blur-md border border-white/5">
              {/* Skill 1 */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3 text-white font-semibold text-lg">
                    <div className="p-2 bg-emerald-500/20 rounded-lg"><Brain className="w-5 h-5 text-emerald-400" /></div> Artificial Intelligence
                  </div>
                  <span className="text-emerald-400 font-bold">95%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full relative" style={{ width: '95%' }}>
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                  </div>
                </div>
              </div>
              
              {/* Skill 2 */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3 text-white font-semibold text-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg"><Code className="w-5 h-5 text-blue-400" /></div> Web Development
                  </div>
                  <span className="text-blue-400 font-bold">90%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full relative" style={{ width: '90%' }}></div>
                </div>
              </div>

              {/* Skill 3 */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3 text-white font-semibold text-lg">
                    <div className="p-2 bg-purple-500/20 rounded-lg"><Palette className="w-5 h-5 text-purple-400" /></div> UI/UX Design
                  </div>
                  <span className="text-purple-400 font-bold">85%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full relative" style={{ width: '85%' }}></div>
                </div>
              </div>

              {/* Skill 4 */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3 text-white font-semibold text-lg">
                    <div className="p-2 bg-amber-500/20 rounded-lg"><Megaphone className="w-5 h-5 text-amber-400" /></div> Marketing & Growth
                  </div>
                  <span className="text-amber-400 font-bold">80%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full relative" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
          {/* Decorative background patterns */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight">Ready to Build With Us?</h2>
            <p className="text-emerald-100 text-xl md:text-2xl mb-12 leading-relaxed">
              Whether you want to learn cutting-edge skills, mentor the next generation, or collaborate on innovative projects, there's a place for you here.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/peer-education" className="px-10 py-5 bg-white text-emerald-700 text-lg font-bold rounded-full hover:bg-slate-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 group w-full sm:w-auto justify-center">
                Join Us <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white/40 text-white text-lg font-bold rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center gap-3 w-full sm:w-auto justify-center">
                Collaborate
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Team;