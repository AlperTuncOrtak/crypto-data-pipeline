with open('src/pages/Settings.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix Section closing tag
c = c.replace(
'''    </motion.div>
  );
}

function Field({ label, children, hint }) {''',
'''    </motion.div>
  );
}

function Field({ label, children, hint }) {'''
)

# Wait, the replace string for closing div was c = c.replace('</div >', '</div>') which was wrong because it didn't change the outer div.
# Let's see how Section ends.
# function Section({ title, icon: Icon, children }) {
#   return (
#     <motion.div variants={{...}} ...>
#       <div className="...">...</div>
#       <div className="p-6">{children}</div>
#     </div>
#   );
# }
# Here the outer is <motion.div> but it closes with </div>.

# Let's fix it by regex:
import re
c = re.sub(r'(function Section\(\{ title, icon: Icon, children \}\) \{\s*return \(\s*<motion\.div[\s\S]*?)</div>\s*\);\s*\}', r'\1</motion.div>\n  );\n}', c)

# Fix the outer motion.div around the main sections.
# I had wrapped it: <motion.div variants={containerVariants} initial="hidden" animate="show">
# and ended it with </motion.div> but it seems the closing tag had an error.
# The Settings() component ends like this:
#       {/* ── DANGER ZONE ── */}
#       <Section title={t("settings.danger_zone")} icon={Shield}>
#         ...
#       </Section>
#       </motion.div>
#     </div>
#   );
# }
# But wait, wait. The error says [builtin:vite-transform] Expected corresponding JSX closing tag for 'motion.div'.
# And lines 46:7 and 667:9.
with open('src/pages/Settings.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
