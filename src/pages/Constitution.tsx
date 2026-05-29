import React from 'react';
import { motion } from 'motion/react';
import { Shield, Book, Users, Award, Clock, FileText } from 'lucide-react';

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="flex items-center gap-4 mb-8 border-b border-silver/10 pb-4">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
      <Icon size={20} />
    </div>
    <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest">
      {title}
    </h2>
  </div>
);

const OfficerCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-silver/5 border border-silver/10 p-6 rounded-2xl hover:border-primary/30 transition-all group">
    <h3 className="text-lg font-bold text-primary uppercase tracking-widest mb-3 group-hover:text-white transition-colors">
      {title}
    </h3>
    <p className="text-silver/60 text-sm leading-relaxed font-light">
      {description}
    </p>
  </div>
);

export default function Constitution() {
  return (
    <main className="w-full bg-pure-black min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-silver/10 border border-silver/20 mb-6"
          >
            <Book size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Organizational Governance</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-[0.1em] mb-4"
          >
            The Light
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-silver/40 text-sm uppercase tracking-[0.3em]"
          >
            Constitution & Bylaws: Article VI
          </motion.p>
        </header>

        {/* Article VI Section 1 */}
        <section className="mb-20">
          <SectionHeader title="Article VI: Officers" icon={Shield} />
          
          <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl mb-12">
            <p className="text-silver/80 text-lg font-light leading-relaxed italic">
              "Section 1: The members of the Directorate shall be the Basileus, the 1st Anti-Basileus, the 2nd Anti-Basileus, the Grammateus, the Pecunious Grammateus, the Tamiouchos, the Epistoleus, the Hodegos, and the Historian."
            </p>
          </div>

          <div className="grid gap-6">
            <OfficerCard 
              title="Basileus"
              description="The Basileus will preside at each meeting. They will prepare an agenda and give the meetings structure and direction. They will adhere to parliamentary procedure. They will serve as an ex-officio member of all committees except the Nominating Committee. They may recommend members for appointed positions as well as serve as the official representative of the organization. They also approve, implement, and delegate all business of the organization. They must be knowledgeable of parliamentary procedures, 'The Mother', and 'The Light'."
            />
            <OfficerCard 
              title="1st Anti-Basileus"
              description="The 1st Anti-Basileus assumes the duties of the Basileus during their absence. They represent the Basileus upon their request or absence. All committees should report their responsibilities in relation to official work to the 1st Anti-Basileus, who will then report to the directorate."
            />
            <OfficerCard 
              title="2nd Anti-Basileus"
              description="The 2nd Anti-Basileus assumes the duties of the Basileus, if the 1st Anti-Basileus and Basileus are absent. They represent the Basileus upon their request or absence. 2nd Anti-Basileus must be a neophyte member and/or the last membership pledge class."
            />
            <OfficerCard 
              title="Grammateus"
              description="The Grammateus maintains accurate records of all organizational proceedings. They maintain a roster of all active and financial members. They call roll at each organizational meeting and whenever requested to do so. They read the previous recorded minutes and/or provide copies at each organizational meeting. They report committees’ recommendations. They record business of all meetings and keeps all minutes in bound volumes. Grammateus assists the Basileus in preparing the agenda and in establishing quorum. For elections, they will seal and preserves ballots and tallies. They perform other duties as requested by Basileus."
            />
            <OfficerCard 
              title="Pecunious Grammateus"
              description="The Pecunious Grammateus records all monies for the organization. They will give receipts for all income received and maintains duplicates of all receipts in the Receipt Book. The money will go to the organization bank account were both the Tamiouhos and the Pecunious Grammateus will have access to the account. They maintain the cash receipts journal for the organization. As well as maintains current alphabetical list of all financial members. May call roll on request. They maintain record of funds submitted to the Tamiouchos as well as keeps a record of all payments made by each member and brings it to organizational meetings. This member serves on the Budget and Finance Committee."
            />
            <OfficerCard 
              title="Tamiouchos"
              description="The Tamiouchos is the guardian of all the organization’s funds. The money will go to the organization bank account were both the Tamiouchos and the Pecunious Grammateus will have access to the account. Reconciles monthly bank statements and provides monthly reports of income received (sources), expenditures (purposes), and account balances as of the date of the report. They prepare the annual financial report and an annual budget with the assistance of the Budget and Finance Committee. The Tamiouchos also maintains the organizational Cash Ledger and the organization account. They secure the organization’s approval for spending non-budged monies through the contingency fund and may chair the Budget and Finance Committee if there is no current committee chairman."
            />
            <OfficerCard 
              title="Epistoleus"
              description="The Epistoleus notifies members of meetings and checks the organization email regularly. They will send out correspondence for the organization as directed by the Basileus. They maintain the organization’s correspondence files and reads all correspondence at the organization meeting."
            />
            <OfficerCard 
              title="Hodegos"
              description="The Hodegos receives and introduces all visitors. They take care of all courtesies the organization should extend. They will be a member of the Social, Hospitality, and Protocol Committee. They will serve as the chair, if anyone of these committee chairpersons are vacant. They will assist the Basileus with all Ceremonies. They will assist the Membership Intake chairmen with all functions and receptions."
            />
            <OfficerCard 
              title="Historian"
              description="The Historian maintains accurate historical records of the organization’s activities. They prepare narrative archives of organization’s activities and keeps the permanent history of the organization. They keep pictures, newspaper articles, and other media related to organization and member’s activities. They work cooperatively with the Program Chairman. They chair the organization’s Archives and Awards Committee. They are responsible for making the organization scrapbook (yearly/biannually)."
            />
          </div>
        </section>

        {/* Section 2 & 3 */}
        <section className="mb-20">
          <SectionHeader title="Terms & Elections" icon={Clock} />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm">Section 2: Term of Office</h4>
              <p className="text-silver/60 text-sm leading-relaxed">
                The term of office for each officer shall be for two years. Term is from July 1 – June 30.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm">Section 3: Election Cycle</h4>
              <p className="text-silver/60 text-sm leading-relaxed">
                Officers shall be elected in May and installed at the last meeting in June. Members shall be nominated by the organization and names will be submitted to the Nominating Committee after verification of financial obligations.
              </p>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="mb-20">
          <SectionHeader title="Eligibility & Voting" icon={Users} />
          <div className="bg-silver/5 border border-silver/10 p-8 rounded-3xl space-y-6">
            <div className="flex gap-4">
              <Award className="text-primary shrink-0" size={20} />
              <div>
                <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2">Service Requirement</h4>
                <p className="text-silver/60 text-sm leading-relaxed">
                  All Positions require the member to be part of the organization for at least a year, except for the 2nd Anti-Basileus, which must be filled by a Neophyte member.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <FileText className="text-primary shrink-0" size={20} />
              <div>
                <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2">Voting Quorum</h4>
                <p className="text-silver/60 text-sm leading-relaxed">
                  A quorum for voting purposes shall consist of a simple majority (51%) of those financial members present at an announced meeting. Voting on candidates requires two-thirds financial members to participate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <SectionHeader title="Transition of Office" icon={Award} />
          <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl">
            <p className="text-silver/80 text-sm leading-relaxed">
              "Section 4: It shall be the duty of each officer to deliver to his successor all files, supplies, materials, and records in his possession within 14 calendar days after the installation. If not complied with, it shall be the duty of the Basileus to ensure that transfers are facilitated."
            </p>
          </div>
        </section>

        <footer className="mt-20 pt-12 border-t border-silver/10 text-center">
          <p className="text-silver/20 text-[10px] uppercase tracking-[0.4em]">
            Official Constitution of The Order of KP, Inc.
          </p>
        </footer>
      </div>
    </main>
  );
}
